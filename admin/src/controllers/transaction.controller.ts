class transactionController {
    static async createTransaction(req: Request, res: Response) {
        // in this we need to create a transaction 
        // we need to get the transaction details from the request 
        // we then create the transaction in the db 
        // we then return the transaction details 
    }
    static async getTransaction(req: Request, res: Response) {
        // in this we need to get the transaction details 
        // we need to get the transaction id from the request 
        // we then get the transaction from the db 
        // we then return the transaction details 
    }
    static async AddWorkerBankDetails(req: Request, res: Response) {
        // in this when he gives the bank credentials 
        // we need to set the bank credentials in the db 
        // we then setup the worker account in razrpay 
        // we then setup the fund account in razrpay 
        // so that when money is suppose to be transfered 
    }
    static async getWorkerBankDetails(req: Request, res: Response) {
        // in this we need to get the bank details of the worker 
        // we need to get the worker id from the request 
        // we then get the worker from the db 
        // we then get the bank details from the db 
    }
}