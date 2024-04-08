import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1710223565420 implements MigrationInterface {
  name = 'Init1710223565420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."payments_type_enum" AS ENUM('toss')`);
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "type" "public"."payments_type_enum" NOT NULL, "amount" integer NOT NULL DEFAULT '0', "tx_info" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_renewal_type_enum" AS ENUM('week', 'month', 'annual', 'permanent')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "workspace_id" integer NOT NULL, "name" character varying NOT NULL, "renewal_type" "public"."subscriptions_renewal_type_enum" NOT NULL, "paid_plan" boolean NOT NULL DEFAULT true, "automatic_renewal" boolean NOT NULL DEFAULT true, "valid" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_subscriptions" ("id" SERIAL NOT NULL, "current_subscription_id" integer NOT NULL, "next_subscription_id" integer, "workspace_user_id" integer NOT NULL, "renewed_at" TIMESTAMP NOT NULL DEFAULT now(), "renew_at" TIMESTAMP NOT NULL DEFAULT now(), "suspended" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_9599e61f5c07f0004b48ce605e" UNIQUE ("workspace_user_id"), CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_history_tx_type_enum" AS ENUM('automatic', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_subscription_history" ("id" SERIAL NOT NULL, "user_subscription_id" integer NOT NULL, "payment_id" integer, "tx_type" "public"."user_subscription_history_tx_type_enum" NOT NULL DEFAULT 'automatic', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bdb6275fb4c17335469fec6017f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      ['db', 'public', 'workspace_users', 'GENERATED_COLUMN', 'valid', 'valid_by_user and valid_by_admin'],
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_users" ("id" SERIAL NOT NULL, "workspace_id" integer NOT NULL, "user_id" integer NOT NULL, "name" character varying NOT NULL, "valid" boolean GENERATED ALWAYS AS (valid_by_user and valid_by_admin) STORED NOT NULL, "valid_by_user" boolean NOT NULL DEFAULT true, "valid_by_admin" boolean NOT NULL DEFAULT true, "workspace_order_of_user" numeric(10) NOT NULL DEFAULT '50000', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6d52a8e2739982d783279cffe84" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_admins_global_permission_enum" AS ENUM('master', 'power-modderator', 'moderator', 'member', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_admins" ("id" SERIAL NOT NULL, "workspace_id" integer NOT NULL, "admin_id" integer NOT NULL, "name" character varying NOT NULL, "global_permission" "public"."workspace_admins_global_permission_enum" NOT NULL DEFAULT 'viewer', "granted_permission" jsonb NOT NULL, "valid" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb71f7afd63278c14e98d001aed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_admin_requests" ("id" SERIAL NOT NULL, "workspace_id" integer NOT NULL, "admin_id" integer NOT NULL, "approved" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_35c9d8f60f00ba4f845bc8b6cc1" UNIQUE ("workspace_id", "admin_id"), CONSTRAINT "PK_d3294621d14925e3ea457cef438" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_admin_invitations_permission_enum" AS ENUM('master', 'power-modderator', 'moderator', 'member', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_admin_invitations" ("id" SERIAL NOT NULL, "workspace_id" integer NOT NULL, "email" character varying NOT NULL, "permission" "public"."workspace_admin_invitations_permission_enum" NOT NULL DEFAULT 'viewer', "approved" boolean NOT NULL DEFAULT false, "valid" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_62bf828caf23bf73e669dc87509" UNIQUE ("workspace_id", "email"), CONSTRAINT "PK_c188be1ce9c4dd49d4d25fd53be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "items" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "workspace_id" integer NOT NULL, "valid" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_items" ("id" SERIAL NOT NULL, "item_id" integer NOT NULL, "workspace_user_id" integer NOT NULL, "remain_amount" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_7a0c4ac9b9c1964aa61fc85d38d" UNIQUE ("item_id", "workspace_user_id"), CONSTRAINT "PK_73bc2ecd8f15ae345af4d8c3c09" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "granted_history" ("id" SERIAL NOT NULL, "user_item_id" integer NOT NULL, "amount" integer NOT NULL, "payment_id" integer, "begin_at" TIMESTAMP NOT NULL DEFAULT now(), "end_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP, CONSTRAINT "PK_4e2cbb2f650a8eec66fae41235d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77af2d2f3f7a2937f7012f8816" ON "granted_history" ("user_item_id", "payment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "used_history" ("id" SERIAL NOT NULL, "user_item_id" integer NOT NULL, "amount" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP, CONSTRAINT "PK_819f03540d541c973616caa68d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."coupons_coupon_type_enum" AS ENUM('infinite', 'once')`);
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" SERIAL NOT NULL, "coupon_type" "public"."coupons_coupon_type_enum" NOT NULL DEFAULT 'once', "valid" boolean NOT NULL DEFAULT true, "workspace_id" integer NOT NULL, "user_id" integer, "code" character varying NOT NULL, "begin_at" TIMESTAMP NOT NULL DEFAULT now(), "end_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_c2976f4d947944d7cac1c98ecc4" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_fe82aa1c1c60d6cdfae44832f10" FOREIGN KEY ("current_subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_a10dfb1f74237101f284414aff2" FOREIGN KEY ("next_subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_9599e61f5c07f0004b48ce605e0" FOREIGN KEY ("workspace_user_id") REFERENCES "workspace_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_history" ADD CONSTRAINT "FK_50113a3932ee8d0ccabd9e01946" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_history" ADD CONSTRAINT "FK_1c59c92583c1190d0adab253f5e" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_users" ADD CONSTRAINT "FK_fcf62799ed815343a7703a53f1b" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_users" ADD CONSTRAINT "FK_b463ff02bbb1014cd4f2b603be0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_admins" ADD CONSTRAINT "FK_7698519a416475bcf76be27dd5e" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_admins" ADD CONSTRAINT "FK_d3f82e9d74f99bc9b12f1193043" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_admin_requests" ADD CONSTRAINT "FK_58baed0659fb8020049044bcff5" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_admin_requests" ADD CONSTRAINT "FK_50847a22f7c314effb085f02ad5" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_admin_invitations" ADD CONSTRAINT "FK_16e441da950deeabb17c7cd801d" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD CONSTRAINT "FK_07283d84b7f16143b884f4d8cb6" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_items" ADD CONSTRAINT "FK_9a25434e868cc98a8401560adc8" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_items" ADD CONSTRAINT "FK_e4fc614793246c6edb7f1275326" FOREIGN KEY ("workspace_user_id") REFERENCES "workspace_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "granted_history" ADD CONSTRAINT "FK_596d2a42b3fc1e409fc841507b9" FOREIGN KEY ("user_item_id") REFERENCES "user_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "granted_history" ADD CONSTRAINT "FK_45fba0fc02ce4a2b95e0134f890" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "used_history" ADD CONSTRAINT "FK_8fcf6be801e69151911a090e244" FOREIGN KEY ("user_item_id") REFERENCES "user_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_599d2271a4df68e8922e2bab6ec" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_9974c02e617aa96ddafd8404323" FOREIGN KEY ("user_id") REFERENCES "workspace_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "coupons" DROP CONSTRAINT "FK_9974c02e617aa96ddafd8404323"`);
    await queryRunner.query(`ALTER TABLE "coupons" DROP CONSTRAINT "FK_599d2271a4df68e8922e2bab6ec"`);
    await queryRunner.query(`ALTER TABLE "used_history" DROP CONSTRAINT "FK_8fcf6be801e69151911a090e244"`);
    await queryRunner.query(`ALTER TABLE "granted_history" DROP CONSTRAINT "FK_45fba0fc02ce4a2b95e0134f890"`);
    await queryRunner.query(`ALTER TABLE "granted_history" DROP CONSTRAINT "FK_596d2a42b3fc1e409fc841507b9"`);
    await queryRunner.query(`ALTER TABLE "user_items" DROP CONSTRAINT "FK_e4fc614793246c6edb7f1275326"`);
    await queryRunner.query(`ALTER TABLE "user_items" DROP CONSTRAINT "FK_9a25434e868cc98a8401560adc8"`);
    await queryRunner.query(`ALTER TABLE "items" DROP CONSTRAINT "FK_07283d84b7f16143b884f4d8cb6"`);
    await queryRunner.query(
      `ALTER TABLE "workspace_admin_invitations" DROP CONSTRAINT "FK_16e441da950deeabb17c7cd801d"`,
    );
    await queryRunner.query(`ALTER TABLE "workspace_admin_requests" DROP CONSTRAINT "FK_50847a22f7c314effb085f02ad5"`);
    await queryRunner.query(`ALTER TABLE "workspace_admin_requests" DROP CONSTRAINT "FK_58baed0659fb8020049044bcff5"`);
    await queryRunner.query(`ALTER TABLE "workspace_admins" DROP CONSTRAINT "FK_d3f82e9d74f99bc9b12f1193043"`);
    await queryRunner.query(`ALTER TABLE "workspace_admins" DROP CONSTRAINT "FK_7698519a416475bcf76be27dd5e"`);
    await queryRunner.query(`ALTER TABLE "workspace_users" DROP CONSTRAINT "FK_b463ff02bbb1014cd4f2b603be0"`);
    await queryRunner.query(`ALTER TABLE "workspace_users" DROP CONSTRAINT "FK_fcf62799ed815343a7703a53f1b"`);
    await queryRunner.query(`ALTER TABLE "user_subscription_history" DROP CONSTRAINT "FK_1c59c92583c1190d0adab253f5e"`);
    await queryRunner.query(`ALTER TABLE "user_subscription_history" DROP CONSTRAINT "FK_50113a3932ee8d0ccabd9e01946"`);
    await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_9599e61f5c07f0004b48ce605e0"`);
    await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_a10dfb1f74237101f284414aff2"`);
    await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_fe82aa1c1c60d6cdfae44832f10"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_c2976f4d947944d7cac1c98ecc4"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_coupon_type_enum"`);
    await queryRunner.query(`DROP TABLE "used_history"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77af2d2f3f7a2937f7012f8816"`);
    await queryRunner.query(`DROP TABLE "granted_history"`);
    await queryRunner.query(`DROP TABLE "user_items"`);
    await queryRunner.query(`DROP TABLE "items"`);
    await queryRunner.query(`DROP TABLE "workspace_admin_invitations"`);
    await queryRunner.query(`DROP TYPE "public"."workspace_admin_invitations_permission_enum"`);
    await queryRunner.query(`DROP TABLE "workspace_admin_requests"`);
    await queryRunner.query(`DROP TABLE "workspace_admins"`);
    await queryRunner.query(`DROP TYPE "public"."workspace_admins_global_permission_enum"`);
    await queryRunner.query(`DROP TABLE "admins"`);
    await queryRunner.query(`DROP TABLE "workspace_users"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'valid', 'db', 'public', 'workspace_users'],
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_subscription_history"`);
    await queryRunner.query(`DROP TYPE "public"."user_subscription_history_tx_type_enum"`);
    await queryRunner.query(`DROP TABLE "user_subscriptions"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_renewal_type_enum"`);
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_type_enum"`);
  }
}
