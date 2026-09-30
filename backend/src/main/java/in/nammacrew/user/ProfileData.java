package in.nammacrew.user;

import java.util.List;
import java.util.UUID;

public record ProfileData(
    String fullName,
    String customerType,
    String companyName,
    String workerType,
    String profilePhotoUrl,
    UUID tradeId,
    List<UUID> skillIds,
    Integer experienceYears,
    String state,
    String district,
    String city,
    String postalCode,
    String availability,
    String teamName,
    Integer teamSize) {}
