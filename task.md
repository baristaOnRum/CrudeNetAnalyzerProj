# Backend Tasks
- [x] 1. Update AuditRepository, PacketRepository, and UserRepository to extend JpaSpecificationExecutor.
- [x] 2. Create DTOs (AuditSearchCriteria, PacketSearchCriteria, UserSearchCriteria) for the search payload.
- [x] 3. Create Specification classes (or use lambda specifications) for fuzzy searching across fields (using `LIKE %term%`), date ranges, length ranges, etc.
- [x] 4. Implement `POST /api/audits/search`, `POST /api/packets/search`, `POST /api/users/search` in their controllers to accept the Criteria DTO + Pageable, and return a Page object.
- [x] 5. Create `GET /api/audits/metadata` and `GET /api/packets/metadata` to return available dates or sizes (e.g., min/max bounds).
- [x] 6. Implement `POST /api/audits/export` and `POST /api/packets/export` which accept the Criteria DTO and export CSV/PDF matching the criteria.
