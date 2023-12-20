/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE "orders_detail" (
        "id" serial primary key,
        "email" varchar(255) NOT NULL,
        "link" varchar(255),
        "name" varchar(255) NOT NULL,
        "phone" varchar(15) NOT NULL,
        "country" varchar(50) NOT NULL,
        "address" varchar(255) NOT NULL,
        "zip_code" integer NOT NULL,
        "delivery" integer REFERENCES delivery ON DELETE SET NULL,
        "comment" text
    )
  `);
};

exports.down = () => {
  return null;
};
