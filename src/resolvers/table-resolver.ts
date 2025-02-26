import {Repository} from "typeorm";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {AdjCustomer, DimCustomer, Table, TableInput, Upload} from "../types/types.js";
import {AppDataSource} from "../connection/datasource.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";



@Resolver(of => Table)
export class TableResolver {
    private tableRepository: Repository<Table> =
        AppDataSource.getRepository(Table);
    private dimCustomerRepository: Repository<DimCustomer> =
        AppDataSource.getRepository(DimCustomer);
    private adjCustomerRepository: Repository<AdjCustomer> =
        AppDataSource.getRepository(AdjCustomer);

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

    // ======= EXPORT EXCEL =======
    @Query(() => String)
    async exportExcel(
        @Arg("tableName", {nullable: true}) tableName?: string,
        @Arg("fromDate", {nullable: true}) description?: string,
        @Arg("toDate", {nullable: true}) toDate?: string
    ): Promise<string> {
        let datas: DimCustomer[] = [];
        if (tableName == 'dimCustomer') {
            await this.dimCustomerRepository.query("CALL mergeadjtodimcustomer()");
            datas = await this.dimCustomerRepository.find();
            const workbook: ExcelJS.Workbook = new ExcelJS.Workbook();
            const worksheet: ExcelJS.Worksheet = workbook.addWorksheet("DimCustomer");

            worksheet.columns = [
                {header: "ID", key: "id", width: 10},
                {header: "Customer ID", key: "customerId", width: 30},
                {header: "Name", key: "name", width: 50},
                {header: "Email", key: "email", width: 50},
                {header: "Phone", key: "phone", width: 50},
                {header: "Address", key: "address", width: 50},
                {header: "Valid start", key: "validStart", width: 50},
                {header: "Valid end", key: "validEnd", width: 50},
                {header: "Is current", key: "isCurrent", width: 50}
            ]

            datas.forEach((data: DimCustomer): void => {
                worksheet.addRow({
                    id: data.id,
                    customerId: data.customerId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    isCurrent: data.isCurrent,
                    validStart: data.validStart,
                    validEnd: data.validEnd
                });
            });

            const buffer: ExcelJS.Buffer = await workbook.xlsx.writeBuffer();
            return Buffer.from(buffer).toString("base64");
        }
    }

    // ======= EXPORT PDF =======
    @Query(() => String)
    async exportPDF(
        @Arg("tableName", {nullable: true}) tableName?: string,
        @Arg("fromDate", {nullable: true}) description?: string,
        @Arg("toDate", {nullable: true}) toDate?: string
    ): Promise<string> {
        const tables = await this.tableRepository.find();
        const doc = new PDFDocument();
        let buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
        });

        doc.fontSize(20).text("Table List", {align: "center"}).moveDown();

        tables.forEach((table) => {
            doc.fontSize(14).text(`ID: ${table.id}`);
            doc.fontSize(14).text(`Table Name: ${table.tableName}`);
            doc.fontSize(14).text(`Description: ${table.description}`);
            doc.moveDown();
        });

        doc.end();
        await new Promise((resolve) => doc.on("end", resolve));

        const pdfBuffer = Buffer.concat(buffers);
        return pdfBuffer.toString("base64"); // Trả về Base64 để client tải về
    }
}