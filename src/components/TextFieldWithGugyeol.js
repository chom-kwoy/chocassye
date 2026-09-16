import {
  Box,
  Button,
  IconButton,
  Paper,
  Popper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

import { suggestGugyeol } from "./Gugyeol";
import { useTranslation } from "./TranslationProvider";
import { StyledTableCell } from "./client_utils";

export default function TextFieldWithGugyeol(props) {
  const { t } = useTranslation();
  const uniqueId = React.useId();
  const inputRef = React.useRef(null);
  const pendingSelection = React.useRef(null);
  const [selection, setSelection] = React.useState({
    start: props.value.length,
    end: props.value.length,
  });

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [gugyeolInputOpen, setGugyeolInputOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useLayoutEffect(() => {
    const pending = pendingSelection.current;
    if (pending && pending.value === props.value && inputRef.current) {
      pendingSelection.current = null;
      inputRef.current.setSelectionRange(pending.cursor, pending.cursor);
      inputRef.current.focus();
    }
  }, [props.value, selection]);

  function updateSelection(event) {
    const { selectionStart, selectionEnd } = event.target;
    setSelection({ start: selectionStart, end: selectionEnd });
  }

  function toggleGugyeolInput() {
    setAnchorEl(inputRef.current);
    setGugyeolInputOpen(!gugyeolInputOpen);
    setIsFocused(!gugyeolInputOpen);
  }

  function replaceGugyeol(suggestion) {
    const term =
      props.value.slice(0, suggestion.replaceStart) +
      suggestion.gugyeol +
      props.value.slice(suggestion.replaceEnd);
    const cursor = suggestion.replaceStart + suggestion.gugyeol.length;
    pendingSelection.current = { value: term, cursor };
    setSelection({ start: cursor, end: cursor });
    props.onChange({ target: { value: term } });
  }

  let text = props.value;
  let suggestedGugyeols =
    selection.start === selection.end
      ? suggestGugyeol(text, selection.start)
      : [];
  let groupedSuggestions = [];
  const COLUMNS = 3;
  for (let i = 0; i < suggestedGugyeols.length; i++) {
    if (i % COLUMNS === 0) {
      groupedSuggestions.push([]);
    }
    groupedSuggestions[groupedSuggestions.length - 1].push(
      suggestedGugyeols[i],
    );
  }

  function handleKeyDown(event) {
    props.onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      !gugyeolInputOpen ||
      !isFocused ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      !/^[1-9]$/.test(event.key)
    ) {
      return;
    }

    const suggestion = suggestedGugyeols[Number(event.key) - 1];
    if (suggestion) {
      event.preventDefault();
      event.stopPropagation();
      replaceGugyeol(suggestion);
    }
  }

  return (
    <Box>
      <Box position="relative">
        <TextField
          id={uniqueId}
          inputRef={inputRef}
          variant="filled"
          value={props.value}
          label={props.label}
          onChange={(event) => {
            updateSelection(event);
            props.onChange(event);
          }}
          onSelect={updateSelection}
          onFocus={updateSelection}
          onKeyDown={handleKeyDown}
          fullWidth
        />
        <Box
          style={{
            position: "absolute",
            right: 0,
            padding: 0,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <Tooltip title={t("Toggle Gugyeol Input")}>
            <IconButton
              variant="outlined"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => toggleGugyeolInput()}
            >
              <Typography
                sx={{
                  fontSize: "20pt",
                  fontWeight: "900",
                  lineHeight: 0.7,
                  color: gugyeolInputOpen
                    ? (theme) => theme.palette.primary.main
                    : "inherit",
                }}
              >
                <br />
              </Typography>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Popper
        open={gugyeolInputOpen && isFocused}
        anchorEl={anchorEl}
        placement="bottom-end"
        style={{ zIndex: 1000 }}
      >
        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableBody>
              {groupedSuggestions.map((group, i) => (
                <TableRow key={i}>
                  {group.map((suggestion, j) => (
                    <StyledTableCell key={j} sx={{ padding: 0 }}>
                      <Button
                        aria-keyshortcuts={
                          i * COLUMNS + j < 9
                            ? String(i * COLUMNS + j + 1)
                            : undefined
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => replaceGugyeol(suggestion)}
                      >
                        {i * COLUMNS + j < 9 && (
                          <Typography
                            component="kbd"
                            aria-hidden="true"
                            sx={{
                              fontSize: "0.7rem",
                              color: "text.secondary",
                              mr: 1,
                            }}
                          >
                            {i * COLUMNS + j + 1}
                          </Typography>
                        )}
                        <Stack
                          direction="column"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Typography
                            sx={{
                              fontSize: "15pt",
                              fontWeight: "900",
                              lineHeight: 0.8,
                            }}
                          >
                            {suggestion.gugyeol}
                          </Typography>
                          <Typography sx={{ fontSize: "8pt", lineHeight: 0.8 }}>
                            {suggestion.pron}
                          </Typography>
                        </Stack>
                      </Button>
                    </StyledTableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Popper>
    </Box>
  );
}
