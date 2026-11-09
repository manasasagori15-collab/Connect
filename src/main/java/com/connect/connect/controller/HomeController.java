
package com.connect.connect.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    // Open the existing login page when the user visits the root URL.
    @GetMapping("/")
    public String home() {
        return "redirect:/frontend/index.html";
    }
}
