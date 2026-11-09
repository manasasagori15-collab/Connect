package com.connect.connect.dto;

public record CreateCommentRequest(
    String authorEmail,
    String content
) {
}