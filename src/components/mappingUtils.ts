export type Span = [number, number];

export type ReplaceFunc = (
  match: string,
  ...rest: unknown[]
) => string | [string, Span[]];

export function invert_mapping(mapping: Span[]): Span[] {
  if (mapping.length === 0) {
    return [];
  }
  const inv_mapping: Span[] = new Array(mapping[mapping.length - 1][1]);
  for (let i = 0; i < inv_mapping.length; ++i) {
    inv_mapping[i] = [Infinity, 0];
  }
  for (let i = 0; i < mapping.length; ++i) {
    for (let j = mapping[i][0]; j < mapping[i][1]; ++j) {
      inv_mapping[j] = [
        Math.min(inv_mapping[j][0], i),
        Math.max(inv_mapping[j][1], i + 1),
      ];
    }
  }
  // ensure monotonicity
  let last_mapping = 0;
  for (let i = 0; i < inv_mapping.length; ++i) {
    const begin = Math.min(inv_mapping[i][0], last_mapping);
    const end = Math.max(inv_mapping[i][1], begin);
    inv_mapping[i] = [begin, end];
    last_mapping = end;
  }
  return inv_mapping;
}

export function replace_and_map(
  string: string,
  pattern: RegExp | string,
  replace_func: ReplaceFunc,
  prev_mapping: Span[] | null = null,
): [string, Span[]] {
  let inv_mapper_begin: (i: number) => number;
  let inv_mapper_end: (i: number) => number;
  let mapping_size: number;
  if (prev_mapping === null) {
    inv_mapper_begin = (i) => i;
    inv_mapper_end = (i) => i + 1;
    mapping_size = string.length;
  } else {
    const inv_mapping = invert_mapping(prev_mapping);
    inv_mapper_begin = (i) => inv_mapping[i][0];
    inv_mapper_end = (i) => inv_mapping[i][1];
    mapping_size = prev_mapping.length;
  }

  let last_offset = 0;
  let dst_offset = 0;
  const mapping: Span[] = new Array(mapping_size);
  for (let i = 0; i < mapping.length; ++i) {
    mapping[i] = [Infinity, 0];
  }

  const orig_string_length = string.length;
  string = string.replace(pattern as string, function (match, ...rest) {
    let sub = replace_func(match, ...rest);
    let sub_mapping: Span[] | null = null;
    if (Array.isArray(sub)) {
      [sub, sub_mapping] = sub;
    }

    const offset = rest[rest.length - 2] as number;

    // before replaced part
    for (let i = 0; i < offset - last_offset; ++i) {
      for (
        let j = inv_mapper_begin(last_offset + i);
        j < inv_mapper_end(last_offset + i);
        ++j
      ) {
        mapping[j] = [
          Math.min(mapping[j][0], dst_offset + i),
          Math.max(mapping[j][1], dst_offset + i + 1),
        ];
      }
    }

    dst_offset += offset - last_offset;
    last_offset = offset;

    // replaced part
    for (let i = 0; i < match.length; ++i) {
      let dst_begin = dst_offset;
      let dst_end = dst_offset + sub.length;

      if (sub_mapping !== null) {
        dst_begin = dst_offset + sub_mapping[i][0];
        dst_end = dst_offset + sub_mapping[i][1];
      }

      for (
        let j = inv_mapper_begin(last_offset + i);
        j < inv_mapper_end(last_offset + i);
        ++j
      ) {
        mapping[j] = [
          Math.min(mapping[j][0], dst_begin),
          Math.max(mapping[j][1], dst_end),
        ];
      }
    }

    dst_offset += sub.length;
    last_offset += match.length;

    return sub;
  });

  // remaining part
  const offset = orig_string_length;
  for (let i = 0; i < offset - last_offset; ++i) {
    for (
      let j = inv_mapper_begin(last_offset + i);
      j < inv_mapper_end(last_offset + i);
      ++j
    ) {
      mapping[j] = [
        Math.min(mapping[j][0], dst_offset + i),
        Math.max(mapping[j][1], dst_offset + i + 1),
      ];
    }
  }

  // ensure monotonicity
  let last_mapping = 0;
  for (let i = 0; i < mapping.length; ++i) {
    const begin = Math.min(mapping[i][0], last_mapping);
    const end = Math.max(mapping[i][1], begin);
    mapping[i] = [begin, end];
    last_mapping = end;
  }

  return [string, mapping];
}
