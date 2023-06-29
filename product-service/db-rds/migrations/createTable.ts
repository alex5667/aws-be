import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('products', (table) => {
    table.string('id').primary();
    table.string('description').notNullable();
    table.double('price').notNullable();
    table.string('title').notNullable();
  });

  await knex.schema.createTable('stocks', (table) => {
    table.string('product_id').primary().references('id').inTable('products').onDelete('CASCADE');
    table.integer('count').notNullable();
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('stocks');
  await knex.schema.dropTable('products');
}
