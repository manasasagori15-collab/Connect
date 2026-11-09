package com.connect.connect.dto;

public record CreatePostRequest(
    String authorEmail,
    String content
) {
}