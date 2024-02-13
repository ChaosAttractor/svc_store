/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE delivery
      ADD COLUMN "created_at" timestamp,
      ADD COLUMN "updated_at" timestamp
  `);
};

exports.down = () => null;
