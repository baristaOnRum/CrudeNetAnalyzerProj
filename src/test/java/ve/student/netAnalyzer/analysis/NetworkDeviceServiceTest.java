package ve.student.netAnalyzer.analysis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.NetworkDevice;
import ve.student.netAnalyzer.repository.NetworkDeviceRepository;
import ve.student.netAnalyzer.service.NetworkDeviceService;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NetworkDeviceServiceTest {

    @Mock
    private NetworkDeviceRepository repository;

    @InjectMocks
    private NetworkDeviceService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllDevices() {
        NetworkDevice device1 = new NetworkDevice("Router1", "192.168.1.1", "Router");
        NetworkDevice device2 = new NetworkDevice("Switch1", "192.168.1.2", "Switch");
        when(repository.findAll()).thenReturn(Arrays.asList(device1, device2));

        List<NetworkDevice> devices = service.getAllDevices();

        assertEquals(2, devices.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetDeviceById() {
        NetworkDevice device = new NetworkDevice("Router1", "192.168.1.1", "Router");
        when(repository.findById(1L)).thenReturn(Optional.of(device));

        Optional<NetworkDevice> found = service.getDeviceById(1L);

        assertTrue(found.isPresent());
        assertEquals("Router1", found.get().getName());
        verify(repository, times(1)).findById(1L);
    }

    @Test
    void testSaveDevice() {
        NetworkDevice device = new NetworkDevice("Router1", "192.168.1.1", "Router");
        when(repository.save(device)).thenReturn(device);

        NetworkDevice saved = service.saveDevice(device);

        assertNotNull(saved);
        assertEquals("Router1", saved.getName());
        verify(repository, times(1)).save(device);
    }

    @Test
    void testDeleteDevice() {
        service.deleteDevice(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
