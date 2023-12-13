/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE collections (
      "id" serial PRIMARY KEY,
      "name" varchar(255),
      "created_at" timestamp,
      "updated_at" timestamp
    )
  `);
};

exports.down = () => {
  return null;
};
