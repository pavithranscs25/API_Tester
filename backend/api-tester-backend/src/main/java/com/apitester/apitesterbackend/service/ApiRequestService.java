package com.apitester.apitesterbackend.service;


import com.apitester.apitesterbackend.dto.ApiRequest;
import com.apitester.apitesterbackend.dto.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class ApiRequestService {

    private final RestClient restClient;

    public ApiRequestService(RestClient restClient){
        this.restClient=restClient;
    }

    public ApiResponse executeRequest(ApiRequest request){
        if(request == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body cannot be null");
        }

        if(request.getUrl() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL cannot be null");
        }

        if(request.getUrl().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL cannot be empty");
        }

        if(request.getMethod() == null || request.getMethod().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HTTP Method is required");
        }

        try {
            HttpMethod.valueOf(request.getMethod().toUpperCase());
        }catch (IllegalArgumentException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Method should be a vaild HTTP Method");
        }

        long startTime = System.nanoTime();
        String url=request.getUrl();
        String method=request.getMethod();
        HttpMethod httpMethod=HttpMethod.valueOf(method.toUpperCase());
        ApiResponse apiResponse=restClient.method(httpMethod)
                .uri(url)
                .headers(headers -> {
                    request.getHeaders().forEach(headers::add);
                    if(request.getBody() != null &&
                            !request.getBody().isBlank() &&
                            !headers.containsHeader(HttpHeaders.CONTENT_TYPE)){
                        headers.setContentType(MediaType.APPLICATION_JSON);
                    }
                })
                .body(request.getBody())
                .exchange((clientRequest, clientResponse) -> {
                    ApiResponse response=new ApiResponse();
                    response.setStatusCode(
                            clientResponse.getStatusCode().value()
                    );

                    response.setStatusText(
                            clientResponse.getStatusCode().toString()
                    );

                    response.setResponseHeaders(
                            clientResponse.getHeaders().toSingleValueMap()
                    );

                    String responseBody = StreamUtils.copyToString(
                            clientResponse.getBody(),
                            StandardCharsets.UTF_8
                    );

                    response.setResponseBody(responseBody);

                    long responseTime = (System.nanoTime() - startTime)/1000000;

                    response.setResponseTimeMs(responseTime);

                    return response;
                });
        return apiResponse;
    }
}
