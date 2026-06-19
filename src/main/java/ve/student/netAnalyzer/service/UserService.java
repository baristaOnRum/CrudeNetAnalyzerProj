package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.dto.UserUpdateDto;

import java.util.List;

public interface UserService {
    List<AppUser> listUsers();
    AppUser registerUser(UserRegistrationDto userData);
    void deleteUser(Long userId);
    AppUser getUserDetails(Long userId);
    AppUser modifyUser(Long userId, UserUpdateDto newData);
}
