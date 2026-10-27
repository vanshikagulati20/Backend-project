exports.createWarehouse = (req, res) => {
  return res.status(201).json({
    success: true,
    message: "Warehouse data received successfully",
    data: req.body
  });
};

