/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE collections (
      "id" serial PRIMARY KEY,
      "name" varchar(255)
    )
  `);
};

exports.down = () => {
  return null;
};
