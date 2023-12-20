/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE TABLE delivery (
        "id" serial primary key,
        "name" varchar(255),
        "price" integer
    )
  `);
};

exports.down = () => {
  return null;
};
