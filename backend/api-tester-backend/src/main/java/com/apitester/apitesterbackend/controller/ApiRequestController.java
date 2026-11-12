package com.apitester.apitesterbackend.controller;


import com.apitester.apitesterbackend.dto.ApiRequest;
import com.apitester.apitesterbackend.dto.ApiResponse;
import com.apitester.apitesterbackend.service.ApiRequestService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/requests")
public class ApiRequestController {

    private final ApiRequestService service;
    public ApiRequestController(ApiRequestService service){
        this.service=service;
    }

    @PostMapping("/execute")
    public ApiResponse urlRequest(@RequestBody ApiRequest request){
        return service.executeRequest(request);
    }

}
