/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE storages (
      id serial PRIMARY KEY,
      name varchar(50),
      clothes_id integer REFERENCES clothes ON DELETE CASCADE,
      quantity integer,
      created_at timestamp,
      updated_at timestamp
    )
  `)
};

exports.down = () => {
  return null
};
