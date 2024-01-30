/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE clothes_gallery
        ADD COLUMN "order" integer
  `);
};

exports.down = () => null;
