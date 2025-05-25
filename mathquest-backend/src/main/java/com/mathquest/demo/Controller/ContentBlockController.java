package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.ContentBlockDTO;
import com.mathquest.demo.DTO.Request.CreateContentBlockRequest;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.ContentBlockService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600, allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/content-blocks")
public class ContentBlockController {

    @Autowired
    private ContentBlockService contentBlockService;

    @Autowired
    private UserRepository userRepository;

    // Endpoint for teachers to create a content block
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ContentBlockDTO> createContentBlock(
            @Valid @ModelAttribute CreateContentBlockRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ContentBlockDTO createdContentBlock = contentBlockService.createContentBlock(request, currentUser);
        return new ResponseEntity<>(createdContentBlock, HttpStatus.CREATED);
    }

    // Endpoint to get a specific content block by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ContentBlockDTO> getContentBlockById(@PathVariable Long id) {
        ContentBlockDTO contentBlock = contentBlockService.getContentBlockById(id);
        return ResponseEntity.ok(contentBlock);
    }

    // Endpoint to get content blocks by lesson ID
    @GetMapping("/lesson/{lessonId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<ContentBlockDTO>> getContentBlocksByLessonId(@PathVariable Long lessonId) {
        List<ContentBlockDTO> contentBlocks = contentBlockService.getContentBlocksByLessonId(lessonId);
        return ResponseEntity.ok(contentBlocks);
    }

    // Endpoint for teachers to update a content block
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ContentBlockDTO> updateContentBlock(
            @PathVariable Long id,
            @Valid @ModelAttribute CreateContentBlockRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ContentBlockDTO updatedContentBlock = contentBlockService.updateContentBlock(id, request, currentUser);
        return ResponseEntity.ok(updatedContentBlock);
    }

    // Endpoint for teachers to delete a content block
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteContentBlock(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        contentBlockService.deleteContentBlock(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}