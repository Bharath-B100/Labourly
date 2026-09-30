package in.nammacrew.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(in.nammacrew.auth.AuthFailure.class)
  ProblemDetail authentication(in.nammacrew.auth.AuthFailure ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(ex.status()), ex.getMessage());
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    HttpMessageNotReadableException.class,
    IllegalArgumentException.class
  })
  ProblemDetail invalid(Exception ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed.");
  }

  @ExceptionHandler({DataIntegrityViolationException.class, IllegalStateException.class})
  ProblemDetail conflict(Exception ex) {
    return ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT, "The request conflicts with current data or booking availability.");
  }

  @ExceptionHandler(AccessDeniedException.class)
  ProblemDetail forbidden(AccessDeniedException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied.");
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail unexpected(Exception ex) {
    LOG.error("Unhandled request failure", ex);
    return ProblemDetail.forStatusAndDetail(
        HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
  }
}
