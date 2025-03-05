import {Repository} from "typeorm";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {Table, TableInput} from "../types/Table.js";
import {AppDataSource} from "../connection/datasource.js";


@Resolver(of => Table)
export class TableResolver {
  private tableRepository: Repository<Table> =
    AppDataSource.getRepository(Table);

  @Query(returns => [Table])
  async tables(): Promise<Table[]> {
    return await this.tableRepository.find({order: {id: "DESC"}})
  }

  @Query(returns => Table)
  table(@Arg("id", type => ID) id: number): Promise<Table> {
    return this.tableRepository.findOneBy({id})
  }

  @Mutation(returns => Table)
  async createTable(@Arg("tableInput") tableInput: TableInput): Promise<Table> {
    const table: Table = new Table();
    table.tableName = tableInput.tableName;
    table.description = tableInput.description;
    return this.tableRepository.save(table);
  }
}