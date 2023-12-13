/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE clothes (
        "id" serial PRIMARY KEY,
        "name" varchar(255),
        "collection_id" integer REFERENCES collections ON DELETE SET NULL,
        "description" text,
        "image_path" varchar(255),
        "created_at" timestamp,
        "updated_at" timestamp
    )
  `);
};

exports.down = () => {
  return null;
};
