package in.nammacrew.auth;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthConfiguration {
  @Bean
  Clock authClock() {
    return Clock.systemUTC();
  }
}
