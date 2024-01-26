/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE users (
      "id" uuid PRIMARY KEY,
      "keycloak_id" uuid,
      "first_name" varchar(50),
      "last_name" varchar(50),
      "username" varchar(50),
      "email" varchar(50),
      "email_verified" boolean,
      "enabled" boolean,
      "created_at" timestamp,
      "updated_at" timestamp
    )
  `);
};

exports.down = () => null;
