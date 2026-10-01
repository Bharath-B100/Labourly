package in.nammacrew.marketplace;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class MarketplaceDTOs {
  public record WorkerCard(
      UUID id,
      String name,
      String profilePhotoUrl,
      String workerType,
      String trade,
      List<String> skills,
      short experienceYears,
      Integer teamSize,
      String availability,
      String district,
      String city,
      String state,
      String verificationStatus) {}

  public record RequirementView(
      UUID id,
      String title,
      String description,
      String trade,
      List<String> skills,
      int workerCount,
      Instant startsAt,
      Instant endsAt,
      String city,
      String district,
      String state,
      String status,
      Instant createdAt) {}

  public record RequirementForm(
      String title,
      String description,
      UUID tradeId,
      List<UUID> skillIds,
      int workerCount,
      Instant startsAt,
      Instant endsAt,
      String city,
      String district,
      String stateCode,
      Double lat,
      Double lng) {}

  public record Paginated<T>(List<T> items, int total, int page, int size) {}

  public record MatchReason(String type, String explanation) {}

  public record MatchedWorker(WorkerCard worker, List<MatchReason> reasons, int score) {}
}
