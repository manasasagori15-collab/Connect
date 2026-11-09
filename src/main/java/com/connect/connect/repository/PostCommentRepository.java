package com.connect.connect.repository;

import com.connect.connect.entity.Post;
import com.connect.connect.entity.PostComment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostCommentRepository
        extends JpaRepository<PostComment, Long> {

    List<PostComment> findAllByPostOrderByCreatedAtAsc(Post post);

    long countByPost(Post post);

    void deleteByPost(Post post);
}