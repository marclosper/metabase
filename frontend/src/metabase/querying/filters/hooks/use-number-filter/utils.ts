import {
  getAvailableOperatorOptions,
  getDefaultAvailableOperator,
} from "metabase/querying/filters/utils/operators";
import * as Lib from "metabase-lib";

import { OPERATOR_OPTIONS } from "./constants";
import type { NumberValue, OperatorOption } from "./types";

export function isNotEmptyValue(
  value: NumberValue,
): value is Lib.NumberFilterValue {
  return value !== "";
}

export function getAvailableOptions(
  query: Lib.Query,
  stageIndex: number,
  column: Lib.ColumnMetadata,
) {
  return getAvailableOperatorOptions(
    query,
    stageIndex,
    column,
    OPERATOR_OPTIONS,
  );
}

export function getOptionByOperator(operator: Lib.NumberFilterOperator) {
  return OPERATOR_OPTIONS[operator];
}

export function getDefaultOperator(
  query: Lib.Query,
  column: Lib.ColumnMetadata,
  availableOptions: OperatorOption[],
): Lib.NumberFilterOperator {
  const fieldValuesInfo = Lib.fieldValuesSearchInfo(query, column);

  const desiredOperator =
    Lib.isPrimaryKey(column) ||
    Lib.isForeignKey(column) ||
    fieldValuesInfo.hasFieldValues !== "none"
      ? "="
      : "between";
  return getDefaultAvailableOperator(availableOptions, desiredOperator);
}

export function getDefaultValues(
  operator: Lib.NumberFilterOperator,
  values: NumberValue[],
): NumberValue[] {
  const { valueCount, hasMultipleValues } = OPERATOR_OPTIONS[operator];
  if (hasMultipleValues) {
    return values.filter(isNotEmptyValue);
  }

  return Array(valueCount)
    .fill("")
    .map((value, index) => values[index] ?? value);
}

export function isValidFilter(
  operator: Lib.NumberFilterOperator,
  column: Lib.ColumnMetadata,
  values: NumberValue[],
) {
  return getFilterParts(operator, column, values) != null;
}

export function getFilterClause(
  operator: Lib.NumberFilterOperator,
  column: Lib.ColumnMetadata,
  values: NumberValue[],
) {
  const filterParts = getFilterParts(operator, column, values);
  return filterParts != null ? Lib.numberFilterClause(filterParts) : undefined;
}

function getFilterParts(
  operator: Lib.NumberFilterOperator,
  column: Lib.ColumnMetadata,
  values: NumberValue[],
): Lib.NumberFilterParts | undefined {
  switch (operator) {
    case "between":
      return getBetweenFilterParts(operator, column, values);
    default:
      return getSimpleFilterParts(operator, column, values);
  }
}

function getSimpleFilterParts(
  operator: Lib.NumberFilterOperator,
  column: Lib.ColumnMetadata,
  values: NumberValue[],
): Lib.NumberFilterParts | undefined {
  const { valueCount, hasMultipleValues } = getOptionByOperator(operator);
  if (!values.every(isNotEmptyValue)) {
    return undefined;
  }
  if (hasMultipleValues ? values.length === 0 : values.length !== valueCount) {
    return undefined;
  }

  return {
    operator,
    column,
    values: values.filter(isNotEmptyValue),
  };
}

function getBetweenFilterParts(
  operator: Lib.NumberFilterOperator,
  column: Lib.ColumnMetadata,
  values: NumberValue[],
): Lib.NumberFilterParts | undefined {
  const [startValue, endValue] = values;
  if (isNotEmptyValue(startValue) && isNotEmptyValue(endValue)) {
    const minValue = startValue < endValue ? startValue : endValue;
    const maxValue = startValue < endValue ? endValue : startValue;

    return {
      operator,
      column,
      values: [minValue, maxValue],
    };
  } else if (isNotEmptyValue(startValue)) {
    return {
      operator: ">=",
      column,
      values: [startValue],
    };
  } else if (isNotEmptyValue(endValue)) {
    return {
      operator: "<=",
      column,
      values: [endValue],
    };
  }
}
