"use client";

import { Box, Grid, Tooltip } from "@mui/material";

import { useTranslation } from "@/components/TranslationProvider";
import { StyledTableCell } from "@/components/client_utils";

export function YearCell({
  year,
  yearStart,
  yearEnd,
  yearString,
}: {
  year: number | null;
  yearStart: number;
  yearEnd: number;
  yearString: string;
}) {
  const { t } = useTranslation();

  const label =
    year === null
      ? t("Unknown year")
      : yearEnd - yearStart > 0
        ? `c. ${year}`
        : String(year);

  return (
    <StyledTableCell
      component="th"
      scope="row"
      sx={{ verticalAlign: "top", userSelect: "none" }}
    >
      <Grid sx={{ py: 0.4 }}>
        <Tooltip title={yearString}>
          <Box>{label}</Box>
        </Tooltip>
      </Grid>
    </StyledTableCell>
  );
}
