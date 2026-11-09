package com.connect.connect.controller;

import com.connect.connect.dto.CreateCommentRequest;
import com.connect.connect.dto.CreatePostRequest;
import com.connect.connect.entity.*;
import com.connect.connect.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final PostCommentRepository commentRepository;
    private final UserRepository userRepository;

    public PostController(
            PostRepository postRepository,
            PostLikeRepository likeRepository,
            PostCommentRepository commentRepository,
            UserRepository userRepository) {

        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    // GET ALL POSTS
    @GetMapping("/feed")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFeed(
            @RequestParam String email) {

        User viewer = findUser(email);

        List<Map<String, Object>> feed = new ArrayList<>();

        for (Post post :
                postRepository.findAllByOrderByCreatedAtDesc()) {

            Map<String, Object> postData =
                    new LinkedHashMap<>();

            postData.put("id", post.getId());
            postData.put("authorName", getName(post.getAuthor()));
            postData.put("authorEmail", post.getAuthor().getEmail());
            postData.put("content", post.getContent());
            postData.put("createdAt", post.getCreatedAt());

            postData.put(
                "likeCount",
                likeRepository.countByPost(post)
            );

            postData.put(
                "likedByMe",
                likeRepository.existsByPostAndUser(post, viewer)
            );

            List<Map<String, Object>> commentList =
                    new ArrayList<>();

            for (PostComment comment :
                    commentRepository
                        .findAllByPostOrderByCreatedAtAsc(post)) {

                Map<String, Object> commentData =
                        new LinkedHashMap<>();

                commentData.put("id", comment.getId());
                commentData.put(
                    "authorName",
                    getName(comment.getAuthor())
                );
                commentData.put("content", comment.getContent());
                commentData.put("createdAt", comment.getCreatedAt());

                commentList.add(commentData);
            }

            postData.put("comments", commentList);

            feed.add(postData);
        }

        return feed;
    }

    // CREATE POST
    @PostMapping
    @Transactional
    public Map<String, Object> createPost(
            @RequestBody CreatePostRequest request) {

        User author = findUser(request.authorEmail());

        String content = request.content() == null
                ? ""
                : request.content().trim();

        if (content.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Please write something before posting."
            );
        }

        if (content.length() > 3000) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Your post is too long."
            );
        }

        Post post = new Post(author, content);

        Post savedPost = postRepository.save(post);

        return Map.of(
            "message", "Post created successfully",
            "id", savedPost.getId()
        );
    }

    // LIKE OR UNLIKE POST
    @PostMapping("/{postId}/like")
    @Transactional
    public Map<String, Object> toggleLike(
            @PathVariable Long postId,
            @RequestParam String email) {

        User user = findUser(email);
        Post post = findPost(postId);

        boolean liked;

        if (likeRepository.existsByPostAndUser(post, user)) {

            likeRepository.deleteByPostAndUser(post, user);
            liked = false;

        } else {

            likeRepository.save(new PostLike(post, user));
            liked = true;
        }

        return Map.of(
            "liked", liked,
            "likeCount", likeRepository.countByPost(post)
        );
    }

    // ADD COMMENT
    @PostMapping("/{postId}/comments")
    @Transactional
    public Map<String, Object> addComment(
            @PathVariable Long postId,
            @RequestBody CreateCommentRequest request) {

        User author = findUser(request.authorEmail());
        Post post = findPost(postId);

        String content = request.content() == null
                ? ""
                : request.content().trim();

        if (content.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Comment cannot be empty."
            );
        }

        if (content.length() > 1000) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Comment is too long."
            );
        }

        commentRepository.save(
            new PostComment(post, author, content)
        );

        return Map.of("message", "Comment added successfully");
    }

    // DELETE OWN POST
    @DeleteMapping("/{postId}")
    @Transactional
    public Map<String, String> deletePost(
            @PathVariable Long postId,
            @RequestParam String email) {

        User user = findUser(email);
        Post post = findPost(postId);

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only delete your own posts."
            );
        }

        commentRepository.deleteByPost(post);
        likeRepository.deleteByPost(post);
        postRepository.delete(post);

        return Map.of("message", "Post deleted successfully");
    }

    // FIND USER
    private User findUser(String email) {

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email is required."
            );
        }

        return userRepository
                .findByEmail(email.trim().toLowerCase())
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found. Please sign in again."
                    )
                );
    }

    // FIND POST
    private Post findPost(Long id) {

        return postRepository.findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Post not found."
                    )
                );
    }

    // GET USER'S DISPLAY NAME
    private String getName(User user) {

        String firstName = user.getFirstName() == null
                ? ""
                : user.getFirstName();

        String surname = user.getSurname() == null
                ? ""
                : user.getSurname();

        String fullName = (firstName + " " + surname).trim();

        return fullName.isBlank()
                ? user.getEmail()
                : fullName;
    }
}