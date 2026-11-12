package com.apitester.apitesterbackend.service;


import com.apitester.apitesterbackend.dto.ApiRequest;
import com.apitester.apitesterbackend.dto.ApiResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

@Service
public class ApiRequestService {

    private final RestClient restClient;

    public ApiRequestService(RestClient restClient){
        this.restClient=restClient;
    }

    public ApiResponse executeRequest(ApiRequest request){
        long startTime = System.nanoTime();
        String url=request.getUrl();
        String method=request.getMethod();
        HttpMethod httpMethod=HttpMethod.valueOf(method.toUpperCase());
        ApiResponse apiResponse=restClient.method(httpMethod)
                .uri(url)
                .headers(headers -> {
                    request.getHeaders().forEach(headers::add);
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
