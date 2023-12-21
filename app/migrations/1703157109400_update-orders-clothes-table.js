/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE "orders_clothes"
        ADD "created_at" timestamp,
        ADD "updated_at" timestamp
  `);
};

exports.down = () => {
  return null;
};
