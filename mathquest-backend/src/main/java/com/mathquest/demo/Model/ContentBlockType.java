package com.mathquest.demo.Model;

/**
 * Note: This enum is kept for backwards compatibility,
 * but the newer ContentBlock implementation uses a rich content approach
 * with structured JSON content instead of separate block types.
 */
public enum ContentBlockType {
    TEXT,
    HEADING1,
    HEADING2,
    HEADING3,
    IMAGE,
    VIDEO,
    LINK,
    CODE,
    MATH_FORMULA,
    BULLET_LIST,
    NUMBERED_LIST,
    TABLE,
    DIVIDER,
    RICH_TEXT
}