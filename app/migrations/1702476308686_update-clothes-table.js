/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE clothes ADD COLUMN price integer;
  `);
};

exports.down = () => {
  return null;
};
