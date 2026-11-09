package com.connect.connect.repository;

import com.connect.connect.entity.Post;
import com.connect.connect.entity.PostLike;
import com.connect.connect.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository
        extends JpaRepository<PostLike, Long> {

    boolean existsByPostAndUser(Post post, User user);

    long countByPost(Post post);

    void deleteByPostAndUser(Post post, User user);

    void deleteByPost(Post post);
}