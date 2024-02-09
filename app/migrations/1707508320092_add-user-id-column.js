/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE orders
      ADD COLUMN "user_id" uuid
  `);
};

exports.down = () => null;
