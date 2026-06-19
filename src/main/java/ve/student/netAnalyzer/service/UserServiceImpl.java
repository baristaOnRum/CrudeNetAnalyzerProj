package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.dto.UserUpdateDto;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<AppUser> listUsers() {
        return userRepository.findAll();
    }

    @Override
    public AppUser registerUser(UserRegistrationDto userData) {
        if (userRepository.findByNombre(userData.getNombre()).isPresent()) {
            throw new RuntimeException("El usuario ya existe");
        }
        AppUser user = new AppUser(userData.getNombre(), userData.getPassHasheada(), userData.getRol());
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    @Override
    public AppUser getUserDetails(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    @Override
    public AppUser modifyUser(Long userId, UserUpdateDto newData) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (newData.getNombre() != null) {
            user.setNombre(newData.getNombre());
        }
        if (newData.getRol() != null) {
            user.setRol(newData.getRol());
        }
        return userRepository.save(user);
    }
}
