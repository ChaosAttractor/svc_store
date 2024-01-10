/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE "clothes_gallery" (
      id serial PRIMARY KEY,
      clothes_id integer REFERENCES clothes ON DELETE CASCADE,
      image_path varchar(255),
      created_at timestamp,
      updated_at timestamp
    )
  `)
};

exports.down = () => {
  return null
};
