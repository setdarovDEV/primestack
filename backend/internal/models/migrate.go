package models

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
)

func RunSQLFile(db *sql.DB, path string) error {
	sqlBytes, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read migration file %s: %w", path, err)
	}

	sqlScript := strings.TrimSpace(string(sqlBytes))
	if sqlScript == "" {
		return fmt.Errorf("migration file %s is empty", path)
	}

	if _, err := db.Exec(sqlScript); err != nil {
		return fmt.Errorf("execute migration %s: %w", path, err)
	}

	return nil
}
