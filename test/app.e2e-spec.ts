import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisCache } from 'cache-manager-ioredis-yet';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { appPrepare } from '../src/app.prepare';
import { PolicyPermission, WorkspaceAdmins } from '../src/entities/workspace.admin.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Workspaces } from '../src/entities/workspace.entity';
import { PaymentType } from '../src/entities/payment.entity';

const adminAddress: {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  adminToken: string;
  workspaceToken: Record<string, string>;
}[] = [
  { email: 'a@admin.com', name: 'a', password: '1234', adminToken: '', workspaceToken: {} },
  { email: 'b@admin.com', name: 'b', password: '1234', adminToken: '', workspaceToken: {} },
  { email: 'c@admin.com', name: 'c', password: '1234', adminToken: '', workspaceToken: {} },
  { email: 'd@admin.com', name: 'd', password: '1234', adminToken: '', workspaceToken: {} },
];

const userAddress: {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  userToken: string;
  workspaceToken: Record<string, string>;
}[] = [
  { email: 'a@user.com', name: 'a', password: '1234', userToken: '', workspaceToken: {} },
  { email: 'b@user.com', name: 'b', password: '1234', userToken: '', workspaceToken: {} },
  { email: 'c@user.com', name: 'c', password: '1234', userToken: '', workspaceToken: {} },
  { email: 'd@user.com', name: 'd', password: '1234', userToken: '', workspaceToken: {} },
];

// Prepared DB States for below test
const workspace: Readonly<Pick<Workspaces, 'id' | 'name'>>[] = [
  { id: 1, name: adminAddress[0].name + '의 워크스페이스' },
  { id: 2, name: adminAddress[1].name + '의 워크스페이스' },
  { id: 3, name: adminAddress[2].name + '의 워크스페이스' },
];
const workspaceAdmin: Readonly<
  Pick<WorkspaceAdmins, 'id' | 'globalPermission' | 'grantedPermission' | 'name'> & {
    workspace: Pick<Workspaces, 'id' | 'name'>;
  }
>[] = [
  {
    id: 1,
    globalPermission: PolicyPermission.MASTER,
    grantedPermission: [],
    name: adminAddress[0].name,
    workspace: workspace[0],
  },
  {
    id: 2,
    globalPermission: PolicyPermission.MASTER,
    grantedPermission: [],
    name: adminAddress[1].name,
    workspace: workspace[1],
  },
  {
    id: 3,
    globalPermission: PolicyPermission.MASTER,
    grantedPermission: [],
    name: adminAddress[2].name,
    workspace: workspace[2],
  },
  {
    id: 4,
    globalPermission: PolicyPermission.VIEWER,
    grantedPermission: [],
    name: adminAddress[1].name,
    workspace: workspace[0],
  },
  {
    id: 5,
    globalPermission: PolicyPermission.VIEWER,
    grantedPermission: [],
    name: adminAddress[3].name,
    workspace: workspace[0],
  },
  {
    id: 6,
    globalPermission: PolicyPermission.VIEWER,
    grantedPermission: [],
    name: adminAddress[2].name,
    workspace: workspace[0],
  },
];

let app: INestApplication;
let dataSource: DataSource;
let cache: RedisCache;
let admin0_work0_token: string;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  appPrepare(app);

  dataSource = moduleFixture.get(DataSource);
  cache = moduleFixture.get(CACHE_MANAGER);

  await app.init();
});

afterAll(async () => {
  let i = 0;
  while (i < dataSource.migrations.length) {
    await dataSource.undoLastMigration();
    i++;
  }
  await cache.reset();
});

describe('Default test before one-shot tests', () => {
  it('GET /', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});

describe('Admin Sign-up, Sign-in Test', () => {
  it('Sign up test for Admin', async () => {
    const admin0 = await request(app.getHttpServer()).post('/v1/admin/sign-up').send(adminAddress[0]);
    const admin0_fail = await request(app.getHttpServer()).post('/v1/admin/sign-up').send(adminAddress[0]);
    const admin1 = await request(app.getHttpServer()).post('/v1/admin/sign-up').send(adminAddress[1]);
    const admin2 = await request(app.getHttpServer()).post('/v1/admin/sign-up').send(adminAddress[2]);

    expect(admin0.status).toBe(201);
    expect(admin0_fail.status).toBe(400);
    expect(admin1.status).toBe(201);
    expect(admin2.status).toBe(201);
  });

  it('Sign In test for Admin. Save tokens', async () => {
    const admin0 = await request(app.getHttpServer()).post('/v1/admin/sign-in').send(adminAddress[0]);
    const admin0_work0 = await request(app.getHttpServer())
      .get('/v1/admin/workspace-token')
      .query({ workspaceId: admin0.body.workspaces[0].id })
      .auth(admin0.body.authorization, { type: 'bearer' });
    const admin2 = await request(app.getHttpServer()).post('/v1/admin/sign-in').send(adminAddress[2]);

    expect(admin0.status).toBe(200);
    expect(admin0.body).toEqual({ authorization: expect.any(String), workspaces: [workspaceAdmin[0]] });
    expect(admin0_work0.status).toBe(200);
    expect(admin2.status).toBe(200);
    expect(admin2.body).toEqual({ authorization: expect.any(String), workspaces: [workspaceAdmin[2]] });

    adminAddress[0].adminToken = admin0.body.authorization;
    adminAddress[0].workspaceToken[admin0.body.workspaces[0].id] = admin0_work0.body.authorization;
    adminAddress[2].adminToken = admin2.body.authorization;
  });

  describe('Workspace Test w/ Admin 0 Token', () => {
    // Set admin0_work0_token before start test.
    beforeAll(() => {
      admin0_work0_token = adminAddress[0].workspaceToken['1'];
    });

    it('POST /admin/workspace/invitation', async () => {
      const admin1_invitation = await request(app.getHttpServer())
        .post('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[1].email, permission: PolicyPermission.MASTER });

      // This will override existing invitation.
      const admin1_invitation_update = await request(app.getHttpServer())
        .post('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[1].email, permission: PolicyPermission.VIEWER });
      const admin2_invitation = await request(app.getHttpServer())
        .post('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[3].email, permission: PolicyPermission.VIEWER });

      expect(admin1_invitation.status).toBe(201);
      expect(admin1_invitation_update.status).toBe(201);
      expect(admin2_invitation.status).toBe(201);
    });

    it('GET Workspace 0 invitation status', async () => {
      const invitations = await request(app.getHttpServer())
        .get('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' });
      expect(invitations.status).toBe(200);
      expect(invitations.body).toEqual([
        {
          id: 1,
          workspaceId: workspace[0].id,
          email: 'b@admin.com',
          permission: PolicyPermission.VIEWER,
          approved: false,
          valid: true,
        },
        {
          id: 2,
          workspaceId: workspace[0].id,
          email: 'd@admin.com',
          permission: PolicyPermission.VIEWER,
          approved: false,
          valid: true,
        },
      ]);
    });

    it('Revoke invitation test', async () => {
      //Revoke all invitations
      const admin1_invitation_revoke = await request(app.getHttpServer())
        .delete('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[1].email });
      const admin2_invitation_revoke = await request(app.getHttpServer())
        .delete('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[3].email });

      // There should be no invitation left.
      const checkDeletedInvitation = await request(app.getHttpServer())
        .get('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' });

      // Reinvite admin 1 and 3
      const admin1_invitation = await request(app.getHttpServer())
        .post('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[1].email, permission: PolicyPermission.VIEWER });
      const admin2_invitation = await request(app.getHttpServer())
        .post('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ email: adminAddress[3].email, permission: PolicyPermission.VIEWER });

      // Check if they are invited.
      const invitations = await request(app.getHttpServer())
        .get('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' });

      expect(admin1_invitation_revoke.status).toBe(200);
      expect(admin2_invitation_revoke.status).toBe(200);
      expect(checkDeletedInvitation.status).toBe(200);
      expect(checkDeletedInvitation.body).toEqual([]);
      expect(admin1_invitation.status).toBe(201);
      expect(admin2_invitation.status).toBe(201);
      expect(invitations.status).toBe(200);
      expect(invitations.body).toEqual([
        {
          id: 1,
          workspaceId: workspace[0].id,
          email: 'b@admin.com',
          permission: PolicyPermission.VIEWER,
          approved: false,
          valid: true,
        },
        {
          id: 2,
          workspaceId: workspace[0].id,
          email: 'd@admin.com',
          permission: PolicyPermission.VIEWER,
          approved: false,
          valid: true,
        },
      ]);
    });

    it('Update invitations', async () => {
      const admin1 = await request(app.getHttpServer()).post('/v1/admin/sign-in').send(adminAddress[1]);
      const admin3 = await request(app.getHttpServer()).post('/v1/admin/sign-up').send(adminAddress[3]);
      const admin3_login = await request(app.getHttpServer()).post('/v1/admin/sign-in').send(adminAddress[3]);
      const invitationList = await request(app.getHttpServer())
        .get('/v1/admin/workspace/invitation')
        .auth(admin0_work0_token, { type: 'bearer' });

      expect(admin1.status).toBe(200);
      expect(admin1.body).toEqual({
        authorization: expect.any(String),
        workspaces: [workspaceAdmin[1], workspaceAdmin[3]],
      });
      expect(admin3.status).toBe(201);
      expect(admin3_login.status).toBe(200);
      expect(admin3_login.body).toEqual({ authorization: expect.any(String), workspaces: [workspaceAdmin[4]] });
      expect(invitationList.status).toBe(200);
      expect(invitationList.body).toEqual([]);

      adminAddress[1].adminToken = admin1.body.authorization;
      adminAddress[3].adminToken = admin3_login.body.authorization;
    });

    it('Join Test', async () => {
      const admin2_req = await request(app.getHttpServer())
        .post('/v1/admin/join-in')
        .query({ workspaceId: 1 })
        .auth(adminAddress[2].adminToken, { type: 'bearer' });

      const admin1_req_fail = await request(app.getHttpServer())
        .post('/v1/admin/join-in')
        .query({ workspaceId: 1 })
        .auth(adminAddress[1].adminToken, { type: 'bearer' });

      const admin0_req_list = await request(app.getHttpServer())
        .get('/v1/admin/workspace/join/request')
        .auth(admin0_work0_token, { type: 'bearer' });
      const admin0_req_approve = await request(app.getHttpServer())
        .put('/v1/admin/workspace/join/accept')
        .auth(admin0_work0_token, { type: 'bearer' })
        .send({ data: [{ requestId: 1, approved: true }] });
      const admin2_sign_in = await request(app.getHttpServer()).post('/v1/admin/sign-in').send(adminAddress[2]);

      expect(admin2_req.status).toBe(201);
      expect(admin1_req_fail.status).toBe(400);
      expect(admin0_req_list.status).toBe(200);
      expect(admin0_req_list.body).toEqual([
        {
          id: 1,
          workspaceId: 1,
          adminId: 3,
          approved: false,
        },
      ]);
      expect(admin0_req_approve.status).toBe(200);
      expect(admin2_sign_in.status).toBe(200);
      expect(admin2_sign_in.body).toEqual({
        authorization: expect.any(String),
        workspaces: [workspaceAdmin[2], workspaceAdmin[5]],
      });
    });
  });
});

describe('User Sign-up, Sign-in Test', () => {
  it('User sign-up test', async () => {
    const user0 = await request(app.getHttpServer()).post('/v1/user/sign-up').send(userAddress[0]);
    const user0_fail = await request(app.getHttpServer()).post('/v1/user/sign-up').send(userAddress[0]);
    const user1 = await request(app.getHttpServer()).post('/v1/user/sign-up').send(userAddress[1]);
    const user2 = await request(app.getHttpServer()).post('/v1/user/sign-up').send(userAddress[2]);

    expect(user0.status).toBe(201);
    expect(user0_fail.status).toBe(400);
    expect(user1.status).toBe(201);
    expect(user2.status).toBe(201);
  });

  it('User Sign-in test', async () => {
    const user0 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);
    const user1 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[1]);
    const user2 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[2]);

    expect(user0.status).toBe(200);
    expect(user0.body).toEqual({
      authorization: expect.any(String),
      workspaces: [],
    });
    expect(user1.status).toBe(200);
    expect(user1.body).toEqual({
      authorization: expect.any(String),
      workspaces: [],
    });
    expect(user2.status).toBe(200);
    expect(user2.body).toEqual({
      authorization: expect.any(String),
      workspaces: [],
    });

    // Update User Token
    userAddress[0].userToken = user0.body.authorization;
    userAddress[1].userToken = user1.body.authorization;
    userAddress[2].userToken = user2.body.authorization;
  });

  it('Workspace Join test', async () => {
    const user0_join = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 1 })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user0_work2_join = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 2 })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user0_work3_join = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 3 })
      .auth(userAddress[0].userToken, { type: 'bearer' });

    // Should be failed if user already joined.
    const user0_join_fail = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 1 })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user1_join = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 1 })
      .auth(userAddress[1].userToken, { type: 'bearer' });
    const user2_join = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 1 })
      .auth(userAddress[2].userToken, { type: 'bearer' });

    // Get user sign-in data
    const user0 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);
    const user1 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[1]);
    const user2 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[2]);

    expect(user0_join.status).toBe(201);
    expect(user0_work2_join.status).toBe(201);
    expect(user0_work3_join.status).toBe(201);
    expect(user0_join_fail.status).toBe(400);
    expect(user1_join.status).toBe(201);
    expect(user2_join.status).toBe(201);
    expect(user0.status).toBe(200);
    expect(user0.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 1,
          workspace: workspace[0],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '50000',
        },
        {
          id: 2,
          workspace: workspace[1],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
        {
          id: 3,
          workspace: workspace[2],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '150000',
        },
      ],
    });
    expect(user1.status).toBe(200);
    expect(user1.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 4,
          workspace: workspace[0],
          name: `b`,
          valid: true,
          workspaceOrderOfUser: '50000',
        },
      ],
    });
    expect(user2.status).toBe(200);
    expect(user2.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 5,
          workspace: workspace[0],
          name: `c`,
          valid: true,
          workspaceOrderOfUser: '50000',
        },
      ],
    });

    userAddress[0].userToken = user0.body.authorization;
  });

  it('Request Workspace order for specific user', async () => {
    const user0_reorder = await request(app.getHttpServer())
      .put('/v1/user/workspace-reorder')
      .send({
        headWorkspaceUserId: 1,
        tailWorkspaceUserId: 2,
        targetWorkspaceUserId: 3,
      })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user0 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);

    expect(user0_reorder.status).toBe(200);
    expect(user0.status).toBe(200);
    expect(user0.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 1,
          workspace: {
            id: 1,
            name: `${adminAddress[0].name}의 워크스페이스`,
          },
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '50000',
        },
        {
          id: 3,
          workspace: {
            id: 3,
            name: `${adminAddress[2].name}의 워크스페이스`,
          },
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '75000',
        },
        {
          id: 2,
          workspace: {
            id: 2,
            name: `${adminAddress[1].name}의 워크스페이스`,
          },
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
      ],
    });
  });

  it('leave workspace and rejoin test', async () => {
    const user0 = await request(app.getHttpServer())
      .get('/v1/user/workspace-token')
      .query({ workspaceId: 1 })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user0_leave = await request(app.getHttpServer())
      .delete('/v1/user/workspace/leave')
      .auth(user0.body.authorization, { type: 'bearer' });
    const user0_login0 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);
    const user0_rejoin = await request(app.getHttpServer())
      .post('/v1/user/workspace-join')
      .send({ workspaceId: 1 })
      .auth(userAddress[0].userToken, { type: 'bearer' });
    const user0_login1 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);

    expect(user0.status).toBe(200);
    expect(user0_leave.status).toBe(200);
    expect(user0_login0.status).toBe(200);
    expect(user0_login0.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 3,
          workspace: workspace[2],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '75000',
        },
        {
          id: 2,
          workspace: workspace[1],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
      ],
    });
    expect(user0_rejoin.status).toBe(201);
    expect(user0_login1.status).toBe(200);
    expect(user0_login1.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 3,
          workspace: workspace[2],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '75000',
        },
        {
          id: 2,
          workspace: workspace[1],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
        {
          id: 1,
          workspace: workspace[0],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '150000',
        },
      ],
    });

    userAddress[0].workspaceToken['1'] = user0.body.authorization;
  });

  it('Admin block, unblock test', async () => {
    const admin2_work2 = await request(app.getHttpServer())
      .get('/v1/admin/workspace-token')
      .query({ workspaceId: 3 })
      .auth(adminAddress[2].adminToken, { type: 'bearer' });
    const admin2_block_user0 = await request(app.getHttpServer())
      .put('/v1/admin/workspace/block-user')
      .send({ workspaceUserId: 3 })
      .auth(admin2_work2.body.authorization, { type: 'bearer' });
    const user0_login0 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);
    const admin2_unblock_user0 = await request(app.getHttpServer())
      .put('/v1/admin/workspace/unblock-user')
      .send({ workspaceUserId: 3 })
      .auth(admin2_work2.body.authorization, { type: 'bearer' });
    const user0_login1 = await request(app.getHttpServer()).post('/v1/user/sign-in').send(userAddress[0]);

    expect(admin2_work2.status).toBe(200);
    expect(admin2_block_user0.status).toBe(200);
    expect(user0_login0.status).toBe(200);
    expect(user0_login0.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 2,
          workspace: workspace[1],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
        {
          id: 1,
          workspace: workspace[0],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '150000',
        },
      ],
    });
    expect(admin2_unblock_user0.status).toBe(200);
    expect(user0_login1.status).toBe(200);
    expect(user0_login1.body).toEqual({
      authorization: expect.any(String),
      workspaces: [
        {
          id: 2,
          workspace: workspace[1],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '100000',
        },
        {
          id: 1,
          workspace: workspace[0],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '150000',
        },
        {
          id: 3,
          workspace: workspace[2],
          name: `a`,
          valid: true,
          workspaceOrderOfUser: '200000',
        },
      ],
    });

    adminAddress[2].workspaceToken['3'] = admin2_work2.body.authorization;
  });
});

describe('Item Test', () => {
  it('Item creation from Admin', async () => {
    const item0 = await request(app.getHttpServer())
      .post('/v1/admin/item')
      .send({ type: 'Item1' })
      .auth(admin0_work0_token, { type: 'bearer' });
    const item1 = await request(app.getHttpServer())
      .post('/v1/admin/item')
      .send({ type: 'Item2' })
      .auth(admin0_work0_token, { type: 'bearer' });
    const itemList = await request(app.getHttpServer())
      .get('/v1/admin/item')
      .auth(admin0_work0_token, { type: 'bearer' });

    expect(item0.status).toBe(201);
    expect(item1.status).toBe(201);
    expect(itemList.status).toBe(200);
    expect(itemList.body).toEqual([
      { id: 1, type: 'Item1', workspaceId: 1, valid: true },
      { id: 2, type: 'Item2', workspaceId: 1, valid: true },
    ]);
  });

  it('Item deletion from Admin', async () => {
    const item1 = await request(app.getHttpServer())
      .put('/v1/admin/item')
      .send({ itemId: 2, valid: false })
      .auth(admin0_work0_token, { type: 'bearer' });
    const itemList = await request(app.getHttpServer())
      .get('/v1/admin/item')
      .auth(admin0_work0_token, { type: 'bearer' });
    const duplicated_item_valid = await request(app.getHttpServer())
      .put('/v1/admin/item')
      .send({ itemId: 2, valid: false })
      .auth(admin0_work0_token, { type: 'bearer' });

    expect(item1.status).toBe(200);
    expect(itemList.status).toBe(200);
    expect(itemList.body).toEqual([{ id: 1, type: 'Item1', workspaceId: 1, valid: true }]);
    expect(duplicated_item_valid.status).toBe(200);
  });

  it('Item grant test from Admin', async () => {
    const item0 = await request(app.getHttpServer())
      .put('/v1/admin/item/grant')
      .send({
        workspaceUserId: 1,
        itemId: 1,
        amount: 100,
      })
      .auth(admin0_work0_token, { type: 'bearer' });
    const item0_history = await request(app.getHttpServer())
      .get('/v1/admin/item/grant/history')
      .auth(admin0_work0_token, { type: 'bearer' });
    const item0_user0 = await request(app.getHttpServer())
      .get('/v1/user/item')
      .auth(userAddress[0].workspaceToken['1'], { type: 'bearer' });
    const item0_revoke = await request(app.getHttpServer())
      .delete('/v1/admin/item/grant/history')
      .send({
        grantedItemHistoryId: item0_history.body[0].id,
      })
      .auth(admin0_work0_token, { type: 'bearer' });
    const item0_reget_history = await request(app.getHttpServer())
      .get('/v1/admin/item/grant/history')
      .auth(admin0_work0_token, { type: 'bearer' });
    const item0_reget_user0 = await request(app.getHttpServer())
      .get('/v1/user/item')
      .auth(userAddress[0].workspaceToken['1'], { type: 'bearer' });

    expect(item0.status).toBe(200);
    expect(item0_history.status).toBe(200);
    expect(item0_history.body).toEqual([
      {
        id: 1,
        userItemId: 1,
        amount: 100,
        beginAt: expect.any(String),
        createdAt: expect.any(String),
        endAt: null,
        paymentId: null,
        revokedAt: null,
      },
    ]);
    expect(item0_user0.status).toBe(200);
    expect(item0_user0.body).toEqual([{ id: 1, type: 'Item1', remainAmount: 100 }]);
    expect(item0_revoke.status).toBe(200);
    expect(item0_reget_history.status).toBe(200);
    expect(item0_reget_history.body).toEqual([
      {
        id: 1,
        userItemId: 1,
        amount: 100,
        beginAt: expect.any(String),
        createdAt: expect.any(String),
        endAt: null,
        paymentId: null,
        revokedAt: expect.any(String),
      },
    ]);
    expect(item0_reget_user0.status).toBe(200);
    expect(item0_reget_user0.body).toEqual([{ id: 1, type: 'Item1', remainAmount: 0 }]);
  });

  it('Item buy test', async () => {
    const item0_user0_buy = await request(app.getHttpServer())
      .post('/v1/user/item/buy')
      .send({ itemId: 1, paymentData: { type: PaymentType.TOSS, amount: 10000, info: {} } })
      .auth(userAddress[0].workspaceToken['1'], { type: 'bearer' });
    const item0_user0 = await request(app.getHttpServer())
      .get('/v1/user/item')
      .auth(userAddress[0].workspaceToken['1'], { type: 'bearer' });
    const item0_history = await request(app.getHttpServer())
      .get('/v1/admin/item/grant/history')
      .auth(admin0_work0_token, { type: 'bearer' });

    expect(item0_user0_buy.status).toBe(201);
    expect(item0_user0.status).toBe(200);
    expect(item0_user0.body).toEqual([{ id: 1, type: 'Item1', remainAmount: 100 }]);
    expect(item0_history.status).toBe(200);
    expect(item0_history.body).toEqual([
      {
        id: 1,
        userItemId: 1,
        amount: 100,
        beginAt: expect.any(String),
        createdAt: expect.any(String),
        endAt: null,
        paymentId: null,
        revokedAt: expect.any(String),
      },
      {
        id: 2,
        userItemId: 1,
        amount: 100,
        beginAt: expect.any(String),
        createdAt: expect.any(String),
        endAt: null,
        paymentId: 1,
        revokedAt: null,
      },
    ]);
  });
});
