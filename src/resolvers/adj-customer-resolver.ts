import {Repository} from "typeorm";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {AdjCustomer, AdjCustomerInput} from "../types/AdjCustomer.js";
import {AppDataSource} from "../connection/datasource.js";
import GraphQLUpload from "graphql-upload/GraphQLUpload.js";
import {FileUpload} from "graphql-upload/Upload.js";
import xlsx from "xlsx";

@Resolver(of => AdjCustomer)
export class AdjCustomerResolver {
  private adjCustomerRepository: Repository<AdjCustomer> =
    AppDataSource.getRepository(AdjCustomer);

  @Query(returns => [AdjCustomer])
  async adjCustomers(): Promise<AdjCustomer[]> {
    return await this.adjCustomerRepository.find({order: {id: "DESC"}})
  }

  @Query(returns => AdjCustomer)
  adjCustomer(@Arg("id", type => ID) id: number): Promise<AdjCustomer> {
    return this.adjCustomerRepository.findOneBy({id})
  }

  @Mutation(returns => AdjCustomer)
  async createAdjCustomer(@Arg("adjCustomerInput") adjCustomerInput: AdjCustomerInput): Promise<AdjCustomer> {
    const adjCustomer: AdjCustomer = new AdjCustomer();
    adjCustomer.customerId = adjCustomerInput.customerId;
    adjCustomer.name = adjCustomerInput.name;
    adjCustomer.email = adjCustomerInput.email;
    adjCustomer.phone = adjCustomerInput.phone;
    adjCustomer.address = adjCustomerInput.address;
    adjCustomer.createAt = adjCustomerInput.createAt;
    adjCustomer.isMerge = false;
    return this.adjCustomerRepository.save(adjCustomer);
  }

  @Mutation(returns => String)
  async uploadAdjCustomerFile(
    @Arg("file", () => GraphQLUpload) file: FileUpload
  ): Promise<string> {
    const { createReadStream, filename, mimetype } = file;

    // Kiểm tra định dạng file
    if (!filename.endsWith(".xls") && !filename.endsWith(".xlsx")) {
      throw new Error("Invalid file format. Only .xls and .xlsx allowed");
    }

    // Đọc stream thành buffer
    const stream = createReadStream();
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", chunk => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);

    // Đọc dữ liệu từ buffer bằng xlsx
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(sheet);

    // Chuyển đổi dữ liệu
    let customers = jsonData.map(row => ({
      customerId: row.customerId,
      name: row.name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      createAt: new Date(row.createAt),
      isMerge: false
    }));

    customers = customers.filter(customer => customer.customerId != undefined);

    // Lưu vào database
    await this.adjCustomerRepository.save(customers);

    return `File processed successfully. Total records: ${customers.length}`;
  }
}