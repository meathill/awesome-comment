USE arealme;

WITH CTE AS (
    SELECT id
    FROM ac_comment
    USE INDEX()
    WHERE post_id=${post_id}
      AND status=1
      AND (
        ancestor_id IS NULL
            OR ancestor_id=0
        )
    ORDER BY id DESC
    LIMIT ${start}, 21
)
SELECT *
FROM ac_comment
WHERE status=1
    AND (
        id IN (SELECT * FROM CTE)
        OR ancestor_id IN (SELECT * FROM CTE)
    );
