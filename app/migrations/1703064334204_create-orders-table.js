/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE orders (
      "id" serial primary key,
      "order_id" integer REFERENCES "orders_detail" ON DELETE CASCADE,
      "clothes_id" integer REFERENCES clothes ON DELETE SET NULL,
      "quantity" integer NOT NULL DEFAULT 1
    )
  `);
};

exports.down = () => {
  return null;
};
