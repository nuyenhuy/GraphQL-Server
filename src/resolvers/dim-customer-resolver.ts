import {Repository} from "typeorm";
import {Arg, Authorized, ID, Mutation, Query, Resolver} from "type-graphql";
import {DimCustomer, DimCustomerInput} from "../types/types.js";
import { AppDataSource } from "../connection/datasource.js";

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
}