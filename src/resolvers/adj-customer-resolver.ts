import {Repository} from "typeorm";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {AdjCustomer, AdjCustomerInput} from "../types/types.js";
import { AppDataSource } from "../connection/datasource.js";

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
}