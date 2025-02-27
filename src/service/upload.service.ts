import xlsx from 'xlsx';
import {Repository} from 'typeorm';
import {AdjCustomer} from "../types/types.js";
import {AppDataSource} from "../connection/datasource.js";
import path from 'path';

export const uploadService = {
  async processFile(file: Express.Multer.File) {
    const allowedExtensions: string[] = ['.xls', '.xlsx'];
    const fileExtension: string = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file format. Only .xls and .xlsx allowed');
    }

    const workbook: xlsx.WorkBook = xlsx.readFile(file.path);
    const sheetName: string = workbook.SheetNames[0];
    const sheet: xlsx.WorkSheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    let customers = jsonData.map((row: any) => ({
      customerId: row.customerId,
      name: row.name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      createAt: new Date(row.createAt),
      isMerge: row.isMerge === 'TRUE'
    }));

    customers = customers.filter((customer: AdjCustomer) => customer.customerId != undefined);

    const customerRepo: Repository<AdjCustomer> = AppDataSource.getRepository(AdjCustomer);
    await customerRepo.save(customers);

    return {message: 'File processed successfully', totalRecords: customers.length};
  }
};
