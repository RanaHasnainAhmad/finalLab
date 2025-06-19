const asyncDbHandler = (dbCallFunction) => {
    return async (req, res, next) => {
        Promise.resolve(dbCallFunction(req, res, next))
        .catch((error) => {
            console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`);
            // res.status(500).json({ error: "Internal Server Error" });
            next(error);
        })
    }
}

export { asyncDbHandler }