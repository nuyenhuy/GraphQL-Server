import {Repository} from "typeorm";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {DimCustomer, DimCustomerInput} from "../types/DimCustomer.js";
import {AppDataSource} from "../connection/datasource.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

@Resolver(of => DimCustomer)
export class DimCustomerResolver {
  private dimCustomerRepository: Repository<DimCustomer> =
    AppDataSource.getRepository(DimCustomer);

  @Query(returns => [DimCustomer])
  async dimCustomers(): Promise<DimCustomer[]> {
    return await this.dimCustomerRepository.find({order: {id: "DESC"}})
  }

  @Query(returns => DimCustomer)
  dimCustomer(@Arg("id", type => ID) id: number): Promise<DimCustomer> {
    return this.dimCustomerRepository.findOneBy({id})
  }

  @Mutation(returns => DimCustomer)
  async createDimCustomer(@Arg("dimCustomerInput") dimCustomerInput: DimCustomerInput): Promise<DimCustomer> {
    const dimCustomer: DimCustomer = new DimCustomer();
    dimCustomer.customerId = dimCustomerInput.customerId;
    dimCustomer.name = dimCustomerInput.name;
    dimCustomer.email = dimCustomerInput.email;
    dimCustomer.phone = dimCustomerInput.phone;
    dimCustomer.address = dimCustomerInput.address;
    dimCustomer.validStart = dimCustomerInput.validStart;
    dimCustomer.validEnd = dimCustomerInput.validEnd;
    dimCustomer.isCurrent = true;
    return this.dimCustomerRepository.save(dimCustomer);
  }

  @Query(() => String)
  async export(
    @Arg("tableName", {nullable: true}) tableName?: string,
    @Arg("fromDate", {nullable: true}) description?: string,
    @Arg("toDate", {nullable: true}) toDate?: string,
    @Arg("typeFile", {nullable: true}) typeFile?: string
  ): Promise<string> {
    if (typeFile == 'excel') {
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
    } else {
      const tables: DimCustomer[] = await this.dimCustomerRepository.find();
      const doc = new PDFDocument();
      let buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
      });

      doc.fontSize(20).text("Table List", {align: "center"}).moveDown();

      tables.forEach((table) => {
        doc.fontSize(14).text(`ID: ${table.id}`);
        doc.fontSize(14).text(`Customer ID: ${table.customerId}`);
        doc.fontSize(14).text(`Name: ${table.name}`);
        doc.fontSize(14).text(`Email: ${table.email}`);
        doc.fontSize(14).text(`Phone: ${table.phone}`);
        doc.fontSize(14).text(`Address: ${table.address}`);
        doc.fontSize(14).text(`Valid start: ${table.validStart}`);
        doc.fontSize(14).text(`Valid end: ${table.validEnd}`);
        doc.fontSize(14).text(`Is current: ${table.isCurrent}`);
        doc.moveDown();
      });

      doc.end();
      await new Promise((resolve) => doc.on("end", resolve));

      const pdfBuffer = Buffer.concat(buffers);
      return pdfBuffer.toString("base64"); // Trả về Base64 để client tải về
    }
  }
}