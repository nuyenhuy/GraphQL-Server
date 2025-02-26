CREATE OR REPLACE FUNCTION MergeAdjToDimCustomer()
RETURNS VOID AS
$$
BEGIN
-- Chọn schema trước khi thực thi
SET search_path TO public;
-- Bắt đầu khối lệnh
BEGIN
-- Update các bản ghi hiện tại trong "DimCustomer" để đánh dấu là hết hạn
UPDATE "DimCustomer"
SET "validEnd" = adj."createAt",
    "isCurrent" = false
    FROM "AdjCustomer" adj
WHERE "DimCustomer"."customerId" = adj."customerId"
  AND "DimCustomer"."isCurrent" = true
  AND adj."isMerge" = false;

-- Chèn các bản ghi mới vào "DimCustomer" từ "AdjCustomer"
INSERT INTO "DimCustomer" ("customerId", "name", "address", "phone", "email", "validStart", "validEnd", "isCurrent")
SELECT adj."customerId", adj."name", adj."address", adj."phone", adj."email", adj."createAt", NULL, true
FROM "AdjCustomer" adj
WHERE adj."isMerge" = false
  AND NOT EXISTS (
    SELECT 1 FROM "DimCustomer" dim
    WHERE dim."customerId" = adj."customerId"
      AND dim."isCurrent" = true
);

-- send dấu các bản ghi trong "AdjCustomer" đã được merge
UPDATE "AdjCustomer"
SET "isMerge" = true
WHERE "isMerge" = false;
END;
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback nếu có lỗi xảy ra
        ROLLBACK;
        RAISE;
END;
$$ LANGUAGE plpgsql;
